package com.example.service.offering.service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class ServiceOfferingServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(ServiceOfferingServiceApplication.class, args);
	}

}
