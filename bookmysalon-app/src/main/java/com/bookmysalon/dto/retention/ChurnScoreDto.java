/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-08-31
 */
package com.bookmysalon.dto.retention;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ChurnScoreDto {
    private Long userId;
    /** 0 (likely to churn) .. 100 (highly engaged). */
    private int engagementScore;
    /** LOW | MEDIUM | HIGH */
    private String riskLevel;
    private long bookingsLast30Days;
    private long cancellationsLast90Days;
    private LocalDateTime lastActivityAt;
}
