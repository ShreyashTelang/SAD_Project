package com.sps.persistence.repository;

import com.sps.persistence.domain.AccountStatus;
import com.sps.persistence.domain.Role;
import com.sps.persistence.domain.User;
import com.sps.persistence.domain.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRole(Role role);
    List<User> findByRoleAndApprovalStatus(Role role, VerificationStatus status);
    List<User> findByAccountStatus(AccountStatus status);
}
