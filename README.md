# Mini-Blog

Application de blog moderne avec architecture découplée **Spring Boot 3** (Java 21) et **Angular 18**, base de données **PostgreSQL 16** et conteneurisation **Docker**.

## Lancement Rapide (Docker Compose)

1. *(Optionnel)* Personnaliser les identifiants de base de données à partir du gabarit :
```bash
cp .env.example .env
```

2. Compiler et démarrer l'ensemble des services en arrière-plan :
```bash
docker compose up --build -d
```

Pour arrêter les services :
```bash
docker compose down
```

Pour consulter les logs en temps réel :
```bash
docker compose logs -f
```

### Accès aux Services

| Service | URL |
|---|---|
| **Application Web (Frontend)** | [http://localhost:4200](http://localhost:4200) |
| **API REST (Backend)** | [http://localhost:8080](http://localhost:8080) |
| **Documentation Swagger UI** | [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html) |

## Documentation

Le rapport complet est disponible dans le dossier `doc/` :

- **Rapport PDF** : [`doc/rapport.pdf`](doc/rapport.pdf)
- **Source LaTeX** : [`doc/rapport.tex`](doc/rapport.tex)
