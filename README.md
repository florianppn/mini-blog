# Mini-Blog

Application de blog moderne avec architecture découplée **Spring Boot 3** (Java 21) et **Angular 18**, base de données **PostgreSQL 16** et conteneurisation **Docker**.

## Démarrage Rapide

Lancez l'ensemble de la stack en une seule commande :

```bash
# 1. (Optionnel) Personnaliser les variables d'environnement
cp .env.example .env

# 2. Démarrer l'ensemble des conteneurs
docker compose up --build -d
```

### Accès aux Services

| Service | URL |
|---|---|
| **Application Web (Frontend)** | [http://localhost:4200](http://localhost:4200) |
| **API REST (Backend)** | [http://localhost:8080](http://localhost:8080) |
| **Documentation Swagger UI** | [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html) |

---

## Développement Local

### Backend (Spring Boot)

```bash
# Lancer PostgreSQL
docker compose up -d postgres

# Exécuter les tests (18 tests automatisés)
cd backend && mvn test

# Lancer le serveur backend
mvn spring-boot:run
```

### Frontend (Angular 18)

```bash
cd frontend

# Installer les dépendances
npm install

# Lancer le serveur de développement avec proxy d'API
npm start
```

---

## Documentation & Rapport d'Architecture

Le rapport complet justifiant l'ensemble des choix techniques, la matrice de sécurité et les détails d'implémentation est disponible dans le dossier `doc/` :

- **Rapport PDF** : [`doc/rapport.pdf`](doc/rapport.pdf)
- **Source LaTeX** : [`doc/rapport.tex`](doc/rapport.tex)
