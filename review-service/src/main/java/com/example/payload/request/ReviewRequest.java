package com.example.payload.request;

import lombok.Data;

@Data
public class ReviewRequest {
    private String text;

    private Double rating;
}
