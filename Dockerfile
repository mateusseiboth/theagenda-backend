# Dockerfile
FROM node:latest
WORKDIR /app

# Copia arquivos
COPY package.json ./
COPY tsconfig.json ./
COPY bunfig.toml ./

# Instala dependências
RUN npm install
COPY . .

# Instala bun
RUN npm install -g bun

# Gera Prisma
RUN npx prisma generate

# Define a URL do banco via ENV (ou pega do build args)
ARG DATABASE_URL
ARG API_GW_URL
ARG PORT
ARG NODE_ENV
ARG JWT_SECRET
ARG JWT_EXPIRES_IN
ARG ADMIN_PHONE
ARG ADMIN_PASSWORD
ENV DATABASE_URL=${DATABASE_URL}
ENV API_GW_URL=${API_GW_URL}
ENV PORT=${PORT}
ENV NODE_ENV=${NODE_ENV}
ENV JWT_SECRET=${JWT_SECRET}
ENV JWT_EXPIRES_IN=${JWT_EXPIRES_IN}
ENV ADMIN_PHONE=${ADMIN_PHONE}
ENV ADMIN_PASSWORD=${ADMIN_PASSWORD}


# Aplica migrations usando a URL do ENV
RUN npx prisma migrate deploy

CMD ["bun", "run", "dev:bun"]
