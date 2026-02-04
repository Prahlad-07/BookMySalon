package com.example.controller;

import com.example.model.Review;
import com.example.payload.dto.SalonDto;
import com.example.payload.dto.UserDto;
import com.example.payload.request.ReviewRequest;
import com.example.payload.response.ApiResponse;
import com.example.payload.response.ReviewDeletedResponse;
import com.example.service.ReviewService;
import com.example.service.client.SalonFeignClient;
import com.example.service.client.UserFeignClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {
    private final ReviewService reviewService;
    private final UserFeignClient userFeignClient;
    private final SalonFeignClient salonFeignClient;

    @PostMapping("/salon/{salonId}")
    public ResponseEntity<Review> createReview(
            @PathVariable("salonId") Long salonId,
            @RequestBody ReviewRequest request,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String jwtToken
            ) {
        UserDto userDto = userFeignClient.getUserProfile(jwtToken).getBody();
        SalonDto salonDto = salonFeignClient.getSalonById(salonId).getBody();
        Review review = reviewService.createReview(request, userDto, salonDto);
        return new ResponseEntity<>(review, HttpStatus.OK);
    }

    @GetMapping("/salon/{salonId}")
    public ResponseEntity<List<Review>> getReviewsBySalonId(
            @PathVariable Long salonId,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String jwtToken
    ) {
        UserDto userDto = userFeignClient.getUserProfile(jwtToken).getBody();
        SalonDto salonDto = salonFeignClient.getSalonById(salonId).getBody();

        List<Review> reviews = reviewService.getReviewsBySalonId(salonDto.getId());
        return new ResponseEntity<>(reviews, HttpStatus.OK);
    }

    @PutMapping("/{reviewId}")
    public ResponseEntity<Review> updateReview(
            @PathVariable Long reviewId,
            @RequestBody ReviewRequest request,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String jwtToken
    ) {
        UserDto userDto = userFeignClient.getUserProfile(jwtToken).getBody();
        Review review = reviewService.updateReview(request, reviewId, userDto.getId());
        return new ResponseEntity<>(review, HttpStatus.OK);
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<ApiResponse> deleteReview(
            @PathVariable Long reviewId,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String jwtToken
    ) {
        UserDto userDto = userFeignClient.getUserProfile(jwtToken).getBody();
        reviewService.deleteReview(reviewId, userDto.getId());
        ApiResponse response = new ApiResponse("Review deleted!");
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
