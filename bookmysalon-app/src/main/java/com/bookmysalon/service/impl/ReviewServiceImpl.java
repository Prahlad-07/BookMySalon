/**
 * @author Prahlad Yadav
 * @version 2.0
 * @since 2026-02-13
 */
package com.bookmysalon.service.impl;

import com.bookmysalon.dto.ReviewDto;
import com.bookmysalon.dto.ReviewRequestDto;
import com.bookmysalon.entity.Review;
import com.bookmysalon.entity.User;
import com.bookmysalon.exception.ConflictException;
import com.bookmysalon.exception.ResourceNotFoundException;
import com.bookmysalon.exception.ReviewNotFoundException;
import com.bookmysalon.repository.ReviewRepository;
import com.bookmysalon.repository.SalonRepository;
import com.bookmysalon.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final SalonRepository salonRepository;

    @Override
    public ReviewDto createReview(ReviewRequestDto reviewRequestDto, Long userId) {
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
        String text = reviewRequestDto.getText() == null ? "" : reviewRequestDto.getText().trim();
        if (text.isEmpty()) {
            throw new IllegalArgumentException("Review text cannot be empty");
        }
        if (text.length() < 10) {
            throw new IllegalArgumentException("Review text must be at least 10 characters long");
        }
        if (text.length() > 1000) {
            throw new IllegalArgumentException("Review text must be 1000 characters or fewer");
        }
        if (!salonRepository.existsById(reviewRequestDto.getSalonId())) {
            throw new ResourceNotFoundException("Salon not found with id: " + reviewRequestDto.getSalonId());
        }
        if (reviewRepository.existsByUserIdAndSalonId(userId, reviewRequestDto.getSalonId())) {
            throw new ConflictException("You have already reviewed this salon. Edit your existing review instead.");
        }

        Review review = new Review();
        review.setText(text);
        review.setRating(reviewRequestDto.getRating());
        review.setSalonId(reviewRequestDto.getSalonId());
        review.setUserId(userId);

        try {
            return mapToDto(reviewRepository.save(review));
        } catch (DataIntegrityViolationException ex) {
            throw new ConflictException("You have already reviewed this salon. Edit your existing review instead.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewDto getReviewById(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ReviewNotFoundException("Review not found with id: " + id));
        return mapToDto(review);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewDto> getAllReviews() {
        return reviewRepository.findAll().stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewDto> getReviewsBySalonId(Long salonId) {
        return reviewRepository.findBySalonIdWithAuthor(salonId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewDto> getReviewsByUserId(Long userId) {
        return reviewRepository.findByUserId(userId).stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    public ReviewDto updateReview(Long id, ReviewRequestDto reviewRequestDto) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ReviewNotFoundException("Review not found with id: " + id));

        if (reviewRequestDto.getText() != null) {
            String text = reviewRequestDto.getText().trim();
            if (text.length() < 10) {
                throw new IllegalArgumentException("Review text must be at least 10 characters long");
            }
            if (text.length() > 1000) {
                throw new IllegalArgumentException("Review text must be 1000 characters or fewer");
            }
            review.setText(text);
        }
        if (reviewRequestDto.getRating() != null) {
            if (reviewRequestDto.getRating() < 1 || reviewRequestDto.getRating() > 5) {
                throw new IllegalArgumentException("Rating must be between 1 and 5");
            }
            review.setRating(reviewRequestDto.getRating());
        }

        return mapToDto(reviewRepository.save(review));
    }

    @Override
    public void deleteReview(Long id) {
        if (!reviewRepository.existsById(id)) {
            throw new ReviewNotFoundException("Review not found with id: " + id);
        }
        reviewRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Double getAverageRating(Long salonId) {
        return reviewRepository.averageRatingForSalon(salonId);
    }

    private ReviewDto mapToDto(Review review) {
        User author = review.getUser();
        return ReviewDto.builder()
                .id(review.getId())
                .text(review.getText())
                .rating(review.getRating())
                .salonId(review.getSalonId())
                .userId(review.getUserId())
                .reviewerName(author != null && author.getFullName() != null && !author.getFullName().isBlank()
                        ? author.getFullName()
                        : "Guest")
                .createdAt(review.getCreatedAt())
                .build();
    }
}
