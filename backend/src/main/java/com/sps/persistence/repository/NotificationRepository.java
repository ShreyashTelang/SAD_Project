package com.sps.persistence.repository;

import com.sps.persistence.domain.Notification;
import com.sps.persistence.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserOrderBySentAtDesc(User user);
    long countByUserAndIsReadFalse(User user);
}
