package com.bookmysalon.controller.recommendation;

import com.bookmysalon.dto.recommendation.RecommendationDto;
import com.bookmysalon.service.recommendation.RecommendationService;
import lombok.RequiredArgsConstructor;
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
    public List<RecommendationDto> recommendSalons(@RequestParam Long userId,
                                                   @RequestParam(required = false) Double lat,
                                                   @RequestParam(required = false) Double lng,
                                                   @RequestParam(defaultValue = "10") int limit) {
        return recommendationService.recommendSalons(userId, lat, lng, limit);
    }
}
