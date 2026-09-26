# Build stage
FROM maven:3.9.16-eclipse-temurin-25-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B

# Runtime stage
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app
RUN addgroup -S miniblog && adduser -S miniblog -G miniblog
USER miniblog
COPY --from=build /app/target/mini-blog-*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
