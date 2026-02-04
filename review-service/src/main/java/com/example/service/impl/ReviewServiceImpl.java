package com.example.service.impl;

import com.example.model.Review;
import com.example.payload.dto.SalonDto;
import com.example.payload.dto.UserDto;
import com.example.payload.request.ReviewRequest;
import com.example.repository.ReviewRepository;
import com.example.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {
    private final ReviewRepository reviewRepository;

    @Override
    public Review createReview(ReviewRequest request, UserDto userDto, SalonDto salonDto) {
        Review review = new Review();
        review.setText(request.getText());
        review.setRating(request.getRating());
        review.setSalonId(salonDto.getId());
        review.setUserId(userDto.getId());

        return reviewRepository.save(review);
    }

    @Override
    public List<Review> getReviewsBySalonId(Long salonId) {
        return reviewRepository.findBySalonId(salonId);
    }

    @Override
    public Review updateReview(ReviewRequest request, Long reviewId, Long userId) {
        Review review = getReviewById(reviewId);
        if (!review.getUserId().equals(userId)) {
            throw new RuntimeException("User doesn't have permission to delete this review!");
        }
        review.setText(request.getText());
        review.setRating(request.getRating());
        return review;
    }

    @Override
    public void deleteReview(Long reviewId, Long userId) {
        Review review = getReviewById(reviewId);
        if (!review.getUserId().equals(userId)) {
            throw new RuntimeException("User doesn't have permission to delete this review!");
        }
        reviewRepository.deleteById(reviewId);
    }

    private Review getReviewById(Long id) {
        return reviewRepository.findById(id).orElseThrow();
    }

}
