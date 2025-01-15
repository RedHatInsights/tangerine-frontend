# 🍊 tangerine (frontend) <!-- omit from toc -->

- [Overview](#overview)
- [Development Envionment Setup](#development-envionment-setup)
  - [With Docker Compose](#with-docker-compose)
  - [Without Docker Compose](#without-docker-compose)

tangerine is a slim and light-weight RAG (Retieval Augmented Generated) system used to create and manage chat bot agents.

Each agent is intended to answer questions related to a set of documents known as a knowledge base (KB).

## Overview

See the [tangerine-backend overview](https://github.com/RedHatInsights/tangerine-backend#overview) for an introduction.

The frontend provides a UI for managing chat bot agents, including:

1. Agent create/update/delete
2. Document upload
3. Chatting/interacting with an agent

This project is currently used by Red Hat's Hybrid Cloud Management Engineering Productivity Team. It was born out of a hack-a-thon and is still a work in progress. You will find some areas of code well developed while others are in need of attention and some tweaks to make it production-ready are needed (with that said, the project *is* currently in good enough shape to provide a working chat bot system).

Currently, the frontend is mostly used for administration purposes or local testing. The document upload interface in the UI is very rudimentary. The backend's S3 sync is the preferred method to configure agents and indicate which documents should be uploaded.

A related plugin for [Red Hat Developer Hub](https://developers.redhat.com/rhdh/overview) can be found [here](https://github.com/RedHatInsights/backstage-plugin-ai-search-frontend) which is the frontend end-users interact with.

## Development Envionment Setup

A development environment can be set up with or without docker compose.

### With Docker Compose

> **_NOTE:_**  Not supported with Mac, see [Without Docker Compose](#without-docker-compose) below.

1. First, refer to the backend setup guide [here](https://github.com/RedHatInsights/tangerine-backend#with-docker-compose)

2. Once the backend is up and running, start the frontend:

```text
docker compose up --build
```

3. You should then be able to reach the frontend at `http://localhost:3000`

### Without Docker Compose

1. First, refer to the backend setup guide [here](https://github.com/RedHatInsights/tangerine-backend#without-docker-compose)

2. Once the backend is up and running, install the frontend:

    ```text
    npm install
    ```

3. Then start a development server:

    ```text
    npm start
    ```

4. You should then be able to reach the frontend at `http://localhost:3000`
