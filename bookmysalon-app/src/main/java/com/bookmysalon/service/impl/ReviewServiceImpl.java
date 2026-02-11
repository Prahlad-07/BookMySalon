package com.bookmysalon.service.impl;

import com.bookmysalon.dto.ReviewDto;
import com.bookmysalon.dto.ReviewRequestDto;
import com.bookmysalon.entity.Review;
import com.bookmysalon.exception.ReviewNotFoundException;
import com.bookmysalon.repository.ReviewRepository;
import com.bookmysalon.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;

    @Override
    public ReviewDto createReview(ReviewRequestDto reviewRequestDto, Long userId) {
        // Validate input
        if (reviewRequestDto == null) {
            throw new IllegalArgumentException("Review request cannot be null");
        }
        if (reviewRequestDto.getSalonId() == null || reviewRequestDto.getSalonId() <= 0) {
            throw new IllegalArgumentException("Salon ID is required and must be valid");
        }
        if (userId == null || userId <= 0) {
            throw new IllegalArgumentException("User ID is required and must be valid");
        }
        if (reviewRequestDto.getRating() == null || reviewRequestDto.getRating() < 1 || reviewRequestDto.getRating() > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }
        if (reviewRequestDto.getText() == null || reviewRequestDto.getText().trim().isEmpty()) {
            throw new IllegalArgumentException("Review text cannot be empty");
        }
        if (reviewRequestDto.getText().trim().length() < 10) {
            throw new IllegalArgumentException("Review text must be at least 10 characters long");
        }

        Review review = new Review();
        review.setText(reviewRequestDto.getText().trim());
        review.setRating(reviewRequestDto.getRating());
        review.setSalonId(reviewRequestDto.getSalonId());
        review.setUserId(userId);

        Review savedReview = reviewRepository.save(review);
        return mapToDto(savedReview);
    }

    @Override
    public ReviewDto getReviewById(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ReviewNotFoundException("Review not found with id: " + id));
        return mapToDto(review);
    }

    @Override
    public List<ReviewDto> getAllReviews() {
        return reviewRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<ReviewDto> getReviewsBySalonId(Long salonId) {
        return reviewRepository.findBySalonId(salonId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<ReviewDto> getReviewsByUserId(Long userId) {
        return reviewRepository.findByUserId(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public ReviewDto updateReview(Long id, ReviewRequestDto reviewRequestDto) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ReviewNotFoundException("Review not found with id: " + id));

        if (reviewRequestDto.getText() != null) review.setText(reviewRequestDto.getText());
        if (reviewRequestDto.getRating() != null) review.setRating(reviewRequestDto.getRating());

        Review updatedReview = reviewRepository.save(review);
        return mapToDto(updatedReview);
    }

    @Override
    public void deleteReview(Long id) {
        if (!reviewRepository.existsById(id)) {
            throw new ReviewNotFoundException("Review not found with id: " + id);
        }
        reviewRepository.deleteById(id);
    }

    @Override
    public Double getAverageRating(Long salonId) {
        List<Review> reviews = reviewRepository.findBySalonId(salonId);
        if (reviews.isEmpty()) {
            return 0.0;
        }
        return reviews.stream()
                .mapToDouble(Review::getRating)
                .average()
                .orElse(0.0);
    }

    private ReviewDto mapToDto(Review review) {
        return ReviewDto.builder()
                .id(review.getId())
                .text(review.getText())
                .rating(review.getRating())
                .salonId(review.getSalonId())
                .userId(review.getUserId())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
