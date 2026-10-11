/**
 * @author Prahlad Yadav
 * @version 2.0
 * @since 2026-02-13
 */
package com.bookmysalon.controller;

import com.bookmysalon.dto.ReviewDto;
import com.bookmysalon.dto.ReviewRequestDto;
import com.bookmysalon.dto.response.ApiResponse;
import com.bookmysalon.exception.UnauthorizedException;
import com.bookmysalon.security.SecurityUtils;
import com.bookmysalon.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping("/{userId}")
    public ResponseEntity<ApiResponse<ReviewDto>> createReview(@PathVariable Long userId,
                                                              @Valid @RequestBody ReviewRequestDto reviewRequestDto) {
        if (!SecurityUtils.isCustomer() && !SecurityUtils.isAdmin()) {
            throw new UnauthorizedException("Only customers can create reviews");
        }
        if (!SecurityUtils.isAdmin() && !SecurityUtils.currentUserId().equals(userId)) {
            throw new UnauthorizedException("You are not allowed to create a review for another user");
        }
        Long authorId = SecurityUtils.isAdmin() ? userId : SecurityUtils.currentUserId();
        ReviewDto review = reviewService.createReview(reviewRequestDto, authorId);
        return ResponseEntity.ok(ApiResponse.ok(review, "Review created successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReviewDto>> getReview(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(reviewService.getReviewById(id)));
    }

    @GetMapping("/salon/{salonId}")
    public ResponseEntity<ApiResponse<List<ReviewDto>>> getSalonReviews(@PathVariable Long salonId) {
        return ResponseEntity.ok(ApiResponse.ok(reviewService.getReviewsBySalonId(salonId)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ReviewDto>> updateReview(@PathVariable Long id,
                                                              @Valid @RequestBody ReviewRequestDto reviewRequestDto) {
        ensureCanManageReview(reviewService.getReviewById(id));
        ReviewDto updatedReview = reviewService.updateReview(id, reviewRequestDto);
        return ResponseEntity.ok(ApiResponse.ok(updatedReview, "Review updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReview(@PathVariable Long id) {
        ensureCanManageReview(reviewService.getReviewById(id));
        reviewService.deleteReview(id);
        return ResponseEntity.ok(ApiResponse.message("Review deleted successfully"));
    }

    private void ensureCanManageReview(ReviewDto review) {
        if (SecurityUtils.isAdmin()) {
            return;
        }
        if (review.getUserId() == null || !review.getUserId().equals(SecurityUtils.currentUserId())) {
            throw new UnauthorizedException("You are not allowed to manage this review");
        }
    }
}
