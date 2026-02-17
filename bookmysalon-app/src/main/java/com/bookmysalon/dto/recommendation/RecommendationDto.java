package com.bookmysalon.dto.recommendation;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class RecommendationDto {
    private Long salonId;
    private String salonName;
    private Double score;
    private List<String> reason;
}
