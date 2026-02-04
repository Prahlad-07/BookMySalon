package com.example.repository;

import com.example.model.Salon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SalonRepository extends JpaRepository<Salon, Long> {
    Salon findByOwnerId(Long id);

    @Query("select s from Salon s where " +
            "(lower(s.city) like lower(concat('%', :keyword, '%'))) OR " +
            "(lower(s.name) like lower(concat('%', :keyword, '%'))) OR " +
            "(lower(s.address) like lower(concat('%', :keyword, '%')))"
    )
    List<Salon> searchSalons(@Param("keyword") String keyword);


}
