package com.bookmysalon.controller;

import com.bookmysalon.dto.ReviewDto;
import com.bookmysalon.dto.ReviewRequestDto;
import com.bookmysalon.dto.response.ApiResponse;
import com.bookmysalon.service.ReviewService;
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
    public ResponseEntity<ApiResponse<ReviewDto>> createReview(@PathVariable Long userId, @RequestBody ReviewRequestDto reviewRequestDto) {
        try {
            ReviewDto review = reviewService.createReview(reviewRequestDto, userId);
            return ResponseEntity.ok(ApiResponse.<ReviewDto>builder()
                    .success(true)
                    .message("Review created successfully")
                    .data(review)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(400).body(ApiResponse.<ReviewDto>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReviewDto>> getReview(@PathVariable Long id) {
        try {
            ReviewDto review = reviewService.getReviewById(id);
            return ResponseEntity.ok(ApiResponse.<ReviewDto>builder()
                    .success(true)
                    .data(review)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(404).body(ApiResponse.<ReviewDto>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/salon/{salonId}")
    public ResponseEntity<ApiResponse<List<ReviewDto>>> getSalonReviews(@PathVariable Long salonId) {
        try {
            List<ReviewDto> reviews = reviewService.getReviewsBySalonId(salonId);
            return ResponseEntity.ok(ApiResponse.<List<ReviewDto>>builder()
                    .success(true)
                    .data(reviews)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(400).body(ApiResponse.<List<ReviewDto>>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ReviewDto>> updateReview(@PathVariable Long id, @RequestBody ReviewRequestDto reviewRequestDto) {
        try {
            ReviewDto updatedReview = reviewService.updateReview(id, reviewRequestDto);
            return ResponseEntity.ok(ApiResponse.<ReviewDto>builder()
                    .success(true)
                    .message("Review updated successfully")
                    .data(updatedReview)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(404).body(ApiResponse.<ReviewDto>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReview(@PathVariable Long id) {
        try {
            reviewService.deleteReview(id);
            return ResponseEntity.ok(ApiResponse.<Void>builder()
                    .success(true)
                    .message("Review deleted successfully")
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(404).body(ApiResponse.<Void>builder()
                    .success(false)
                    .error(e.getMessage())
                    .build());
        }
    }
}
