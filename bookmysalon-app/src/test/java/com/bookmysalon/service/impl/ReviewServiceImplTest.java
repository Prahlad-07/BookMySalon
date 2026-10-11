package com.bookmysalon.service.impl;

import com.bookmysalon.dto.ReviewDto;
import com.bookmysalon.dto.ReviewRequestDto;
import com.bookmysalon.entity.Review;
import com.bookmysalon.exception.ConflictException;
import com.bookmysalon.repository.ReviewRepository;
import com.bookmysalon.repository.SalonRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReviewServiceImplTest {

    @Mock ReviewRepository reviewRepository;
    @Mock SalonRepository salonRepository;
    @InjectMocks ReviewServiceImpl service;

    private ReviewRequestDto request() {
        return ReviewRequestDto.builder().salonId(3L).rating(5.0).text("Great haircut and friendly staff").build();
    }

    @Test
    void createsReviewWhenNoPriorReviewExists() {
        when(salonRepository.existsById(3L)).thenReturn(true);
        when(reviewRepository.existsByUserIdAndSalonId(7L, 3L)).thenReturn(false);
        when(reviewRepository.save(any(Review.class))).thenAnswer(i -> {
            Review r = i.getArgument(0);
            r.setId(11L);
            return r;
        });

        ReviewDto dto = service.createReview(request(), 7L);

        assertEquals(11L, dto.getId());
        assertEquals(5.0, dto.getRating());
    }

    @Test
    void rejectsSecondReviewForSameSalon() {
        when(salonRepository.existsById(3L)).thenReturn(true);
        when(reviewRepository.existsByUserIdAndSalonId(7L, 3L)).thenReturn(true);

        assertThrows(ConflictException.class, () -> service.createReview(request(), 7L));
        verify(reviewRepository, never()).save(any());
    }

    @Test
    void rejectsShortReviewText() {
        ReviewRequestDto shortText = ReviewRequestDto.builder().salonId(3L).rating(4.0).text("nice").build();
        assertThrows(IllegalArgumentException.class, () -> service.createReview(shortText, 7L));
    }

    @Test
    void rejectsOutOfRangeRating() {
        ReviewRequestDto badRating = ReviewRequestDto.builder().salonId(3L).rating(9.0).text("way too high a rating value").build();
        assertThrows(IllegalArgumentException.class, () -> service.createReview(badRating, 7L));
    }
}
