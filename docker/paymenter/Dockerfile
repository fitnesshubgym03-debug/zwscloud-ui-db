FROM php:8.2-fpm-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    curl \
    git \
    mysql-client \
    zip \
    unzip \
    libzip-dev \
    oniguruma-dev \
    libpng-dev \
    libjpeg-turbo-dev

# Install PHP extensions
RUN docker-php-ext-configure gd --with-jpeg && \
    docker-php-ext-install -j$(nproc) \
    pdo_mysql \
    zip \
    gd \
    mbstring \
    tokenizer \
    ctype \
    json

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Clone Paymenter
RUN git clone https://github.com/Paymenter/Paymenter.git . || echo "Paymenter already exists"

# Install dependencies
RUN composer install --no-dev --optimize-autoloader

# Create necessary directories
RUN mkdir -p storage/logs storage/app storage/framework/{sessions,views,cache} bootstrap/cache && \
    chmod -R 775 storage bootstrap/cache

# Copy theme
COPY ./themes/zws /app/themes/zws

# Copy .env
COPY .env.example .env

# Generate app key
RUN php artisan key:generate

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
CMD ["php", "-S", "0.0.0.0:8080", "-t", "public"]
