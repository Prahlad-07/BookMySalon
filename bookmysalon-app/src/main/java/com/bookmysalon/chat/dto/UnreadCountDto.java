/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-15
 */
package com.bookmysalon.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UnreadCountDto {
    private long unreadMessages;
    private long unreadNotifications;
}
