package com.example.demo.chat;

import com.example.demo.decks.Deck;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChatRepository extends JpaRepository<Chat, Long> {
}
