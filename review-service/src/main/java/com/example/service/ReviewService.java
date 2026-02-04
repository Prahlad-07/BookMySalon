package com.example.service;

import com.example.model.Review;
import com.example.payload.dto.SalonDto;
import com.example.payload.dto.UserDto;
import com.example.payload.request.ReviewRequest;

import java.util.List;

public interface ReviewService {
    Review createReview(ReviewRequest request,
                        UserDto userDto,
                        SalonDto salonDto);

    List<Review> getReviewsBySalonId(Long salonId);

    Review updateReview(ReviewRequest request,
                        Long reviewId,
                        Long userId);

    void deleteReview(Long reviewId, Long userId);
}
