package com.bookmysalon.service;

import com.bookmysalon.dto.ReviewDto;
import com.bookmysalon.dto.ReviewRequestDto;
import java.util.List;

public interface ReviewService {
    ReviewDto createReview(ReviewRequestDto reviewRequestDto, Long userId);
    ReviewDto getReviewById(Long id);
    List<ReviewDto> getAllReviews();
    List<ReviewDto> getReviewsBySalonId(Long salonId);
    List<ReviewDto> getReviewsByUserId(Long userId);
    ReviewDto updateReview(Long id, ReviewRequestDto reviewRequestDto);
    void deleteReview(Long id);
    Double getAverageRating(Long salonId);
}
