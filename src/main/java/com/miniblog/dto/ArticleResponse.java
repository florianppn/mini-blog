package com.miniblog.dto;

import com.miniblog.domain.entity.Article;
import com.miniblog.domain.entity.ArticleStatus;

import java.time.Instant;

public class ArticleResponse {

    private Long id;
    private String title;
    private String content;
    private ArticleStatus status;
    private UserResponse author;
    private Instant createdAt;
    private Instant updatedAt;
    private int commentCount;

    public ArticleResponse() {
    }

    public ArticleResponse(Long id, String title, String content, ArticleStatus status, UserResponse author, Instant createdAt, Instant updatedAt, int commentCount) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.status = status;
        this.author = author;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.commentCount = commentCount;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String title;
        private String content;
        private ArticleStatus status;
        private UserResponse author;
        private Instant createdAt;
        private Instant updatedAt;
        private int commentCount;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder title(String title) {
            this.title = title;
            return this;
        }

        public Builder content(String content) {
            this.content = content;
            return this;
        }

        public Builder status(ArticleStatus status) {
            this.status = status;
            return this;
        }

        public Builder author(UserResponse author) {
            this.author = author;
            return this;
        }

        public Builder createdAt(Instant createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Builder updatedAt(Instant updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public Builder commentCount(int commentCount) {
            this.commentCount = commentCount;
            return this;
        }

        public ArticleResponse build() {
            return new ArticleResponse(id, title, content, status, author, createdAt, updatedAt, commentCount);
        }
    }

    public static ArticleResponse fromEntity(Article article) {
        if (article == null) {
            return null;
        }
        return ArticleResponse.builder()
                .id(article.getId())
                .title(article.getTitle())
                .content(article.getContent())
                .status(article.getStatus())
                .author(UserResponse.fromEntity(article.getAuthor()))
                .createdAt(article.getCreatedAt())
                .updatedAt(article.getUpdatedAt())
                .commentCount(article.getComments() != null ? article.getComments().size() : 0)
                .build();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public ArticleStatus getStatus() {
        return status;
    }

    public void setStatus(ArticleStatus status) {
        this.status = status;
    }

    public UserResponse getAuthor() {
        return author;
    }

    public void setAuthor(UserResponse author) {
        this.author = author;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public int getCommentCount() {
        return commentCount;
    }

    public void setCommentCount(int commentCount) {
        this.commentCount = commentCount;
    }
}
