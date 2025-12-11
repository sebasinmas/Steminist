# Etapa 1: build de la app
FROM node:20-alpine AS build

WORKDIR /app

# Copiar solo package* primero para aprovechar caché
COPY package*.json ./
RUN npm install

# Copiar el resto del código
COPY . .

# ----- PASO CLAVE: variables solo como build args -----
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY

# Pasamos las vars SOLO al proceso de build, no como ENV permanentes
RUN VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    npm run build

# Etapa 2: servir estáticos con Nginx
FROM nginx:alpine AS production

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]