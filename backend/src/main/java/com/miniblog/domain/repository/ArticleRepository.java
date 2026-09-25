package com.miniblog.domain.repository;

import com.miniblog.domain.entity.Article;
import com.miniblog.domain.entity.ArticleStatus;
import com.miniblog.domain.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {

    Page<Article> findByStatus(ArticleStatus status, Pageable pageable);

    Page<Article> findByAuthor(User author, Pageable pageable);

    Page<Article> findByStatusAndAuthor(ArticleStatus status, User author, Pageable pageable);

    @Query("SELECT a FROM Article a WHERE a.status = :status OR a.author = :author")
    Page<Article> findPublishedOrAuthorDrafts(@Param("status") ArticleStatus status, @Param("author") User author, Pageable pageable);
}
