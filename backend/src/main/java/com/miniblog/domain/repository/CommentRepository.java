package com.miniblog.domain.repository;

import com.miniblog.domain.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    Page<Comment> findByArticleIdOrderByCreatedAtDesc(Long articleId, Pageable pageable);

    List<Comment> findByArticleIdOrderByCreatedAtAsc(Long articleId);
}
