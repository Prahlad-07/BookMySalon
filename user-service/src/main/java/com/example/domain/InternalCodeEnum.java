package com.example.domain;


import lombok.Getter;
import org.springframework.http.HttpStatus;

import static org.springframework.http.HttpStatus.*;

@Getter
public enum InternalCodeEnum {
    PROPERTY_MANAGEMENT_CODE_001(1, "Request performed successfully", OK),
    PROPERTY_MANAGEMENT_CODE_002(2, "Property not found", NOT_FOUND),
    PROPERTY_MANAGEMENT_CODE_003(3, "Property created successfully", CREATED),
    PROPERTY_MANAGEMENT_CODE_004(4, "Property updated successfully", OK),
    PROPERTY_MANAGEMENT_CODE_005(5, "Property deleted successfully", OK),
    PROPERTY_MANAGEMENT_CODE_006(6, "User properties retrieved successfully", OK),
    PROPERTY_MANAGEMENT_CODE_007(7, "Booking not found", NOT_FOUND),
    PROPERTY_MANAGEMENT_CODE_008(8, "Booking created successfully", CREATED),
    PROPERTY_MANAGEMENT_CODE_009(9, "Booking updated successfully", OK),
    PROPERTY_MANAGEMENT_CODE_010(10, "Booking deleted successfully", OK),
    PROPERTY_MANAGEMENT_CODE_011(11, "User booking data retrieved successfully", OK),
    REVIEW_MANAGEMENT_CODE_001(1, "Request performed successfully", OK),
    REVIEW_MANAGEMENT_CODE_002(2, "Review not found", NOT_FOUND),
    REVIEW_MANAGEMENT_CODE_003(3, "Review created successfully", CREATED),
    REVIEW_MANAGEMENT_CODE_004(4, "Review updated successfully", OK),
    REVIEW_MANAGEMENT_CODE_005(5, "Review deleted successfully", OK),

    BOOKING_MANAGEMENT_CODE_001(1, "Booking Modification Created Successfully", CREATED),
    BOOKING_MANAGEMENT_CODE_002(2, "Booking Modification fetched Successfully", OK),
    BOOKING_MANAGEMENT_CODE_003(3, "Booking Modification is now confirmed", OK),
    BOOKING_MANAGEMENT_CODE_004(4, "Booking Modification is now rejected", OK);


    private final String codeDescription;
    private final String codeNumber;
    private final HttpStatus httpStatus;

    InternalCodeEnum(int codeNumber, String codeDescription, HttpStatus status) {
        this.codeNumber = String.format("%03d", codeNumber);
        this.codeDescription = codeDescription;
        this.httpStatus = status;
    }
}
