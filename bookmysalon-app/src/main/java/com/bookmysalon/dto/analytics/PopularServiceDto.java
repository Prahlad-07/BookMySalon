package com.bookmysalon.dto.analytics;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PopularServiceDto {
    private Long serviceId;
    private String serviceName;
    private Integer count;
}
