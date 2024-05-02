package com.example.demo.cards;

import jakarta.persistence.Lob;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.ToString;


@Getter
@AllArgsConstructor
@EqualsAndHashCode
@ToString
public class CardRequest {
    private String name;
    private Integer attackPoints;
    private Integer defensePoints;
    private String description;
    @Lob
    private byte[] image;
    private Rarity rarity;
}

