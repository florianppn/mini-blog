package com.miniblog.dto;

import com.miniblog.domain.entity.Comment;

import java.time.Instant;

public class CommentResponse {

    private Long id;
    private String content;
    private Long articleId;
    private UserResponse author;
    private Instant createdAt;
    private Instant updatedAt;

    public CommentResponse() {
    }

    public CommentResponse(Long id, String content, Long articleId, UserResponse author, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.content = content;
        this.articleId = articleId;
        this.author = author;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String content;
        private Long articleId;
        private UserResponse author;
        private Instant createdAt;
        private Instant updatedAt;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder content(String content) {
            this.content = content;
            return this;
        }

        public Builder articleId(Long articleId) {
            this.articleId = articleId;
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

        public CommentResponse build() {
            return new CommentResponse(id, content, articleId, author, createdAt, updatedAt);
        }
    }

    public static CommentResponse fromEntity(Comment comment) {
        if (comment == null) {
            return null;
        }
        return CommentResponse.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .articleId(comment.getArticle() != null ? comment.getArticle().getId() : null)
                .author(UserResponse.fromEntity(comment.getAuthor()))
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Long getArticleId() {
        return articleId;
    }

    public void setArticleId(Long articleId) {
        this.articleId = articleId;
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
}
