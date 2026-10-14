package com.bookmysalon.service;

import com.bookmysalon.dto.SalonDto;
import com.bookmysalon.dto.SalonSearchCriteria;
import com.bookmysalon.dto.response.PageResponse;
import com.bookmysalon.entity.Category;
import com.bookmysalon.entity.Review;
import com.bookmysalon.entity.Salon;
import com.bookmysalon.entity.ServiceOffering;
import com.bookmysalon.entity.User;
import com.bookmysalon.entity.UserRole;
import com.bookmysalon.repository.CategoryRepository;
import com.bookmysalon.repository.ReviewRepository;
import com.bookmysalon.repository.SalonRepository;
import com.bookmysalon.repository.ServiceOfferingRepository;
import com.bookmysalon.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Search runs in the database: filters, Bayesian "top rated" ordering, price floor and paging. */
@SpringBootTest
@Transactional
class SalonSearchIntegrationTest {

    @Autowired SalonService salonService;
    @Autowired SalonStatsService statsService;
    @Autowired SalonRepository salonRepository;
    @Autowired UserRepository userRepository;
    @Autowired ReviewRepository reviewRepository;
    @Autowired ServiceOfferingRepository serviceRepository;
    @Autowired CategoryRepository categoryRepository;
    @Autowired com.bookmysalon.repository.BookingRepository bookingRepository;
    @Autowired BookingService bookingService;

    private final String tag = UUID.randomUUID().toString().substring(0, 8);
    private User owner;

    @BeforeEach
    void setUp() {
        owner = user("owner");
    }

    @Test
    void manyGoodReviewsOutrankAFewPerfectOnes() {
        Salon lucky = salon("Lucky " + tag, "Testcity" + tag);
        Salon proven = salon("Proven " + tag, "Testcity" + tag);
        reviews(lucky, 5, 5);            // 5.0 from two reviews
        reviews(proven, 5, 5, 5, 5, 5, 5, 5, 5, 4, 5, 5, 4); // ~4.8 from twelve
        statsService.refresh(lucky.getId());
        statsService.refresh(proven.getId());

        List<SalonDto> items = search(new SalonSearchCriteria(null, "testcity" + tag, null, null, false, "rating"), 0, 10).getItems();

        assertEquals(List.of("Proven " + tag, "Lucky " + tag), items.stream().map(SalonDto::getName).toList());
    }

    @Test
    void startingPriceIgnoresTinyAddOnsAndFiltersByIt() {
        Salon salon = salon("Priced " + tag, "Pricecity" + tag);
        service(salon, "Upper lip threading " + tag, 40);
        service(salon, "Haircut " + tag, 399);
        statsService.refresh(salon.getId());

        SalonDto dto = salonService.getSalonById(salon.getId());
        assertEquals(399.0, dto.getMinPrice());

        assertEquals(1, search(new SalonSearchCriteria(null, "pricecity" + tag, null, 500.0, false, "price"), 0, 10).getTotalItems());
        assertEquals(0, search(new SalonSearchCriteria(null, "pricecity" + tag, null, 300.0, false, "price"), 0, 10).getTotalItems());
    }

    @Test
    void freeTextMatchesServiceNamesAndPagesResults() {
        for (int i = 0; i < 5; i++) {
            Salon s = salon("Studio " + i + " " + tag, "Pagecity" + tag);
            if (i % 2 == 0) service(s, "Bridal mehendi " + tag, 799);
        }
        PageResponse<SalonDto> page0 = search(new SalonSearchCriteria("mehendi " + tag, null, null, null, false, "name"), 0, 2);
        assertEquals(3, page0.getTotalItems());
        assertEquals(2, page0.getItems().size());
        assertTrue(page0.isHasNext());

        PageResponse<SalonDto> page1 = search(new SalonSearchCriteria("mehendi " + tag, null, null, null, false, "name"), 1, 2);
        assertEquals(1, page1.getItems().size());
        assertFalse(page1.isHasNext());
    }

    @Test
    void pageSizeIsCapped() {
        PageResponse<SalonDto> page = search(new SalonSearchCriteria(null, null, null, null, false, null), 0, 10_000);
        assertTrue(page.getSize() <= 48);
    }

    @Test
    void busySlotsListOnlyActiveBookingsForThatDayWithoutCustomerData() {
        Salon salon = salon("Busy " + tag, "Busycity" + tag);
        User customer = user("cust");
        java.time.LocalDate day = java.time.LocalDate.now().plusDays(3);
        booking(salon, customer, day.atTime(10, 0), 45, com.bookmysalon.entity.BookingStatus.CONFIRMED);
        booking(salon, customer, day.atTime(14, 0), 30, com.bookmysalon.entity.BookingStatus.PENDING);
        booking(salon, customer, day.atTime(16, 0), 30, com.bookmysalon.entity.BookingStatus.CANCELLED);
        booking(salon, customer, day.plusDays(1).atTime(10, 0), 30, com.bookmysalon.entity.BookingStatus.CONFIRMED);

        var busy = bookingService.getBusySlots(salon.getId(), day);

        assertEquals(2, busy.size());
        assertEquals(day.atTime(10, 0), busy.get(0).start());
        assertEquals(day.atTime(10, 45), busy.get(0).end());
        assertEquals(day.atTime(14, 0), busy.get(1).start());
        // The record type has exactly two components: no customer id, name or price can leak.
        assertEquals(2, com.bookmysalon.dto.BusySlotDto.class.getRecordComponents().length);
    }

    private void booking(Salon salon, User customer, java.time.LocalDateTime start, int minutes,
                         com.bookmysalon.entity.BookingStatus status) {
        com.bookmysalon.entity.Booking b = new com.bookmysalon.entity.Booking();
        b.setSalonId(salon.getId());
        b.setCustomerId(customer.getId());
        b.setStartTime(start);
        b.setEndTime(start.plusMinutes(minutes));
        b.setStatus(status);
        b.setTotalPrice(500.0);
        b.setServiceOfferingIds(new java.util.HashSet<>());
        bookingRepository.save(b);
    }

    private PageResponse<SalonDto> search(SalonSearchCriteria c, int page, int size) {
        return salonService.searchSalons(c, page, size);
    }

    private Salon salon(String name, String city) {
        Salon s = new Salon();
        s.setName(name);
        s.setCity(city);
        s.setAddress("1 Test Road, " + city);
        s.setEmail(UUID.randomUUID() + "@test.local");
        s.setPhoneNumber("+91 9" + Math.abs(UUID.randomUUID().hashCode() % 1_000_000_000L));
        s.setOwnerId(owner.getId());
        s.setLatitude(19.0);
        s.setLongitude(72.8);
        s.setOpenTime(LocalTime.of(9, 0));
        s.setCloseTime(LocalTime.of(21, 0));
        return salonRepository.save(s);
    }

    private void service(Salon salon, String name, double price) {
        Category c = new Category();
        c.setName("Cat");
        c.setSalonId(salon.getId());
        c = categoryRepository.save(c);
        ServiceOffering o = new ServiceOffering();
        o.setSalonId(salon.getId());
        o.setCategoryId(c.getId());
        o.setName(name);
        o.setDescription("Test service");
        o.setDuration(30);
        o.setPrice(price);
        serviceRepository.save(o);
    }

    private void reviews(Salon salon, double... ratings) {
        for (double rating : ratings) {
            Review r = new Review();
            r.setSalonId(salon.getId());
            r.setUserId(user("reviewer").getId());
            r.setRating(rating);
            r.setText("Lovely visit, would come back again.");
            reviewRepository.save(r);
        }
        reviewRepository.flush();
    }

    private User user(String prefix) {
        User u = new User();
        String id = prefix + "-" + UUID.randomUUID().toString().substring(0, 12);
        u.setFullName("Test " + prefix);
        u.setUsername(id);
        u.setEmail(id + "@test.local");
        u.setRole(UserRole.CUSTOMER);
        u.setPassword("x");
        return userRepository.save(u);
    }
}
