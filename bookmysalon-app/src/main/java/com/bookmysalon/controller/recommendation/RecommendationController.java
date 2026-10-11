/**
 * @author Prahlad Yadav
 * @version 2.0
 * @since 2026-08-31
 */
package com.bookmysalon.controller.recommendation;

import com.bookmysalon.dto.recommendation.RecommendationDto;
import com.bookmysalon.dto.response.ApiResponse;
import com.bookmysalon.security.SecurityUtils;
import com.bookmysalon.service.recommendation.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping("/salons")
    public ResponseEntity<ApiResponse<List<RecommendationDto>>> recommendSalons(
            @RequestParam(defaultValue = "6") int limit) {
        List<RecommendationDto> recommendations =
                recommendationService.recommendSalons(SecurityUtils.currentUserId(), limit);
        return ResponseEntity.ok(ApiResponse.ok(recommendations));
    }
}
