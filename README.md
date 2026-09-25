# Mini-Blog -- Backend Spring Boot & PostgreSQL

Projet d'application **Mini-Blog** moderne avec architecture découplée. Ce dépôt contient le backend sous forme d'API REST robuste développée avec **Spring Boot 3**, **Java 21**, **PostgreSQL 16**, conteneurisée avec **Docker** et documentée avec **Swagger UI (OpenAPI)** ainsi qu'un rapport d'architecture complet en **LaTeX**.

---

## Sommaire

- [Technologies Utilisées](#technologies-utilisées)
- [Structure du Projet](#structure-du-projet)
- [Règles Métier et Matrice de Sécurité](#règles-métier-et-matrice-de-sécurité)
- [Démarrage Rapide avec Docker](#démarrage-rapide-avec-docker)
- [Développement Local (sans Docker)](#développement-local-sans-docker)
- [Comptes par Défaut](#comptes-par-défaut)
- [Documentation de l'API (Swagger UI)](#documentation-de-lapi-swagger-ui)
- [Rapport d'Architecture LaTeX](#rapport-darchitecture-latex)
- [Tests Automatisés](#tests-automatisés)
- [Référence des Endpoints REST](#référence-des-endpoints-rest)

---

## Technologies Utilisées

- **Langage & Framework** : Java 21 LTS, Spring Boot 3.3.4 (Spring Data JPA, Spring Security 6, Spring Web, Bean Validation).
- **Base de Données** : PostgreSQL 16 (production/docker), H2 (tests en mémoire).
- **Gestionnaire de Migrations** : Flyway (scripts SQL versionnés `V1__init_schema.sql`).
- **Sécurité & Authentification** : Stateless JWT (JJWT 0.12.6) via l'en-tête HTTP `Authorization: Bearer <token>`, hashage des mots de passe avec BCrypt.
- **Documentation d'API** : Springdoc OpenAPI 2.6.0 avec Swagger UI interactif.
- **Conteneurisation** : Docker & Docker Compose (build multi-stage avec runtime JRE slim et utilisateur non-root).
- **Documentation Technique** : Rapport d'architecture rédigé en LaTeX (`doc/rapport.tex` / `doc/rapport.pdf`).

---

## Structure du Projet

Le projet sépare proprement les couches d'infrastructure, de documentation et de logique applicative :

```
mini-blog/
├── backend/                       # Module backend Spring Boot
│   ├── Dockerfile                 # Image Docker multi-stage pour le backend
│   ├── pom.xml                    # Configuration Maven et dépendances
│   └── src/
│       ├── main/
│       │   ├── java/com/miniblog/
│       │   │   ├── MiniBlogApplication.java
│       │   │   ├── config/        # OpenAPI Swagger, DataInitializer (seed admin)
│       │   │   ├── controller/    # Contrôleurs REST (Auth, Article, Comment)
│       │   │   ├── domain/        # Entités JPA (User, Article, Comment) & Repositories
│       │   │   ├── dto/           # Objets de transfert de données et validations
│       │   │   ├── exception/     # Gestionnaire global d'exceptions (RFC 7807)
│       │   │   ├── security/      # Filtre JWT, JwtService, ArticleSecurity, CommentSecurity
│       │   │   └── service/       # Logique métier et respect des règles d'accès
│       │   └── resources/
│       │       ├── application.yml
│       │       └── db/migration/  # Scripts SQL versionnés Flyway
│       └── test/                  # Tests unitaires et d'intégration MockMvc
├── doc/                           # Documentation et rapport technique
│   ├── rapport.tex                # Document source LaTeX (7 axes d'architecture, matrice, tests)
│   └── rapport.pdf                # Rapport compilé en PDF
├── docker-compose.yml             # Orchestration PostgreSQL 16 + Backend Spring Boot
├── .gitignore
└── README.md
```

---

## Règles Métier et Matrice de Sécurité

La sécurité repose sur deux niveaux : le **rôle** (`ROLE_USER`, `ROLE_ADMIN`) et la **propriété de la ressource** (*Resource-level security*).

### Cycle de vie des Articles (Politique Stricte) :
1. **Création** : Un utilisateur authentifié peut créer un article, mais il est **systématiquement créé au statut `DRAFT`**.
2. **Consultation** : 
   - Un visiteur anonyme ne voit **que** les articles `PUBLISHED`.
   - L'auteur d'un article en `DRAFT` peut le consulter.
   - Les autres utilisateurs ne peuvent **pas** voir les `DRAFT` d'autrui.
   - L'administrateur peut voir tous les `DRAFT` de tous les auteurs.
3. **Modification & Suppression** :
   - L'auteur ne peut modifier et supprimer son article **que tant qu'il est au statut `DRAFT`**.
   - Dès qu'un article passe à `PUBLISHED`, **l'auteur ne peut plus y toucher** (politique stricte garantissant l'intégrité éditoriale).
   - Seul l'administrateur peut modifier, supprimer ou dépublier un article `PUBLISHED`.
4. **Workflow de Validation** :
   - Seul l'administrateur peut faire passer un article de `DRAFT` à `PUBLISHED` (`PATCH /api/articles/{id}/publish`).
   - L'administrateur peut également repasser un article en `DRAFT` (`PATCH /api/articles/{id}/unpublish`).

### Modération des Commentaires :
- Seuls les utilisateurs connectés peuvent commenter un article ayant le statut `PUBLISHED` (impossible de commenter un brouillon).
- L'auteur d'un commentaire peut le modifier et le supprimer.
- L'administrateur peut supprimer n'importe quel commentaire (modération totale).
- La suppression d'un article entraîne la suppression physique en cascade de tous ses commentaires.

### Matrice Récapitulative :

| Action / Ressource | Anonyme | Utilisateur (`ROLE_USER`) | Administrateur (`ROLE_ADMIN`) |
|---|:---:|:---:|:---:|
| Inscription (`/api/auth/register`) |  |  |  |
| Connexion (`/api/auth/login`) |  |  |  |
| Voir les articles `PUBLISHED` |  |  |  |
| Voir les articles `DRAFT` | ❌ | Son propre brouillon uniquement | Tous les brouillons |
| Créer un article | ❌ |  (forcé en `DRAFT`) |  (forcé en `DRAFT`) |
| Modifier un `DRAFT` | ❌ | Auteur uniquement |  |
| Supprimer un `DRAFT` | ❌ | Auteur uniquement |  |
| Modifier un `PUBLISHED` | ❌ | ❌ (Politique stricte) |  |
| Supprimer un `PUBLISHED` | ❌ | ❌ (Politique stricte) |  |
| Publier / Dépublier (`PATCH /publish`) | ❌ | ❌ |  |
| Lire les commentaires |  |  |  |
| Commenter un article `PUBLISHED` | ❌ |  |  |
| Commenter un `DRAFT` | ❌ | ❌ | ❌ |
| Modifier un commentaire | ❌ | Auteur uniquement | Auteur uniquement |
| Supprimer un commentaire | ❌ | Auteur uniquement |  (Modération) |

---

## Démarrage Rapide avec Docker

Le moyen le plus simple d'exécuter l'application complète (PostgreSQL + Spring Boot) est d'utiliser Docker Compose :

```bash
# À la racine du projet
docker compose up --build -d
```

### Vérifier l'état des conteneurs :
```bash
docker compose ps
```

### Consulter les logs du backend :
```bash
docker compose logs -f backend
```

### Arrêter les services :
```bash
docker compose down
```

---

## Développement Local (sans Docker)

Si vous souhaitez exécuter le backend directement sur votre machine hôte :

### 1. Démarrer PostgreSQL (via Docker ou localement) :
```bash
docker compose up -d postgres
```

### 2. Lancer le backend avec Maven :
```bash
cd backend
mvn spring-boot:run
```

L'application démarrera sur `http://localhost:8080`.

---

## Comptes par Défaut

Au premier démarrage, un compte administrateur est automatiquement initialisé en base via le composant `DataInitializer` s'il n'existe pas :

- **Email Administrateur** : `admin@miniblog.com`
- **Mot de passe** : `adminPassword123!`
- **Rôle** : `ROLE_ADMIN`

*Note : Ces valeurs sont configurables via les variables d'environnement `APP_ADMIN_EMAIL` et `APP_ADMIN_PASSWORD` dans `docker-compose.yml`.*

---

## Documentation de l'API (Swagger UI)

Une documentation OpenAPI 3 interactive est automatiquement générée et accessible à l'adresse suivante :

👉 **[http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)**

### Comment s'authentifier dans Swagger UI :
1. Utilisez l'endpoint `POST /api/auth/login` avec les identifiants admin ou d'un utilisateur inscrit.
2. Copiez la valeur du `token` retournée dans la réponse JSON.
3. Cliquez sur le bouton vert **"Authorize"** en haut à droite de l'interface Swagger UI.
4. Collez le jeton dans le champ (le préfixe `Bearer` est ajouté automatiquement).
5. Vous pouvez désormais tester l'ensemble des endpoints sécurisés directement depuis votre navigateur.

La spécification brute JSON est disponible sur : `http://localhost:8080/v3/api-docs`.

---

## Rapport d'Architecture LaTeX

Un rapport d'architecture et de conception logicielle détaillé est disponible dans le dossier `doc/` :
- **[doc/rapport.pdf](doc/rapport.pdf)** : Document PDF de 8 pages compilé avec `pdflatex`.
- **[doc/rapport.tex](doc/rapport.tex)** : Code source LaTeX.

Pour recompiler le document LaTeX :
```bash
pdflatex -interaction=nonstopmode -output-directory=doc doc/rapport.tex
```

---

## Tests Automatisés

Le module backend intègre une suite de **18 tests automatisés** couvrant les tests unitaires des services (avec mocks Mockito) et un test d'intégration de sécurité de bout en bout (MockMvc) testant l'intégralité du cycle de vie et de la matrice des droits.

### Exécuter la suite de tests :
```bash
cd backend
mvn clean test
```

Résultats d'exécution :
```
[INFO] Running com.miniblog.SecurityIntegrationTest
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.miniblog.service.ArticleServiceTest
[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.miniblog.service.AuthServiceTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.miniblog.service.CommentServiceTest
[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0
[INFO] Tests run: 18, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

---

## Référence des Endpoints REST

### Authentification (`/api/auth`)
| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Inscription d'un utilisateur (rôle `ROLE_USER`) |
| `POST` | `/api/auth/login` | Public | Connexion et délivrance du Bearer JWT |

### Articles (`/api/articles`)
| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| `GET` | `/api/articles` | Public | Liste paginée (`?page=0&size=10&status=...`), filtre dynamique selon rôle |
| `GET` | `/api/articles/{id}` | Public / Filtré | Détail d'un article (brouillon réservé auteur & admin) |
| `POST` | `/api/articles` | Connecté | Création d'un article (forcé au statut `DRAFT`) |
| `PUT` | `/api/articles/{id}` | Auteur (`DRAFT`) ou Admin | Mise à jour du titre et contenu |
| `DELETE` | `/api/articles/{id}` | Auteur (`DRAFT`) ou Admin | Suppression de l'article (cascade sur commentaires) |
| `PATCH` | `/api/articles/{id}/publish` | **ADMIN uniquement** | Publication de l'article (`DRAFT` $\to$ `PUBLISHED`) |
| `PATCH` | `/api/articles/{id}/unpublish` | **ADMIN uniquement** | Dépublication (`PUBLISHED` $\to$ `DRAFT`) |

### Commentaires (`/api/articles/{articleId}/comments` & `/api/comments`)
| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| `POST` | `/api/articles/{articleId}/comments` | Connecté | Ajouter un commentaire sur un article `PUBLISHED` |
| `GET` | `/api/articles/{articleId}/comments` | Public | Consulter les commentaires paginés d'un article |
| `PUT` | `/api/comments/{commentId}` | Auteur | Modifier son propre commentaire |
| `DELETE` | `/api/comments/{commentId}` | Auteur ou Admin | Supprimer un commentaire (modération) |