package com.bookmysalon.service.impl;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ReviewPublicNameTest {

    @Test
    void showsFirstNameAndLastInitialOnly() {
        assertEquals("Rohit S.", ReviewServiceImpl.publicName("Rohit Sharma"));
        assertEquals("Ananya R.", ReviewServiceImpl.publicName("  Ananya  Mohan rao "));
        assertEquals("Priya", ReviewServiceImpl.publicName("Priya"));
        assertEquals("Guest", ReviewServiceImpl.publicName("  "));
        assertEquals("Guest", ReviewServiceImpl.publicName(null));
    }
}
