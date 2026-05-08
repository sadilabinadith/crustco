package com.example.bakery.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class CustomCake {

    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Unique identifier for the custom cake.
    private Long id;

    private String design; // Requested for the custom cake
    private String message; // Personalized message written on the cake.
}
