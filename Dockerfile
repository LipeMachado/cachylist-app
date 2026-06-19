FROM docker.io/library/ruby:3.4.5-slim

WORKDIR /rails

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y curl libjemalloc2 libpq5 libvips && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

ENV RAILS_ENV=production \
    BUNDLE_DEPLOYMENT=1 \
    BUNDLE_PATH=/usr/local/bundle \
    BUNDLE_WITHOUT=development

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential git libpq-dev libvips libyaml-dev pkg-config && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

COPY Gemfile Gemfile.lock ./
RUN bundle install && \
    rm -rf ~/.bundle/ "${BUNDLE_PATH}"/ruby/*/cache "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git

COPY . .

RUN SECRET_KEY_BASE_DUMMY=1 DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres ./bin/rails assets:precompile

RUN groupadd --system --gid 1000 rails && \
    useradd rails --uid 1000 --gid 1000 --create-home --shell /bin/bash && \
    mkdir -p tmp/pids tmp/sockets tmp/storage && \
    chown -R 1000:1000 tmp log storage
USER 1000:1000

EXPOSE 3000
CMD ["sh", "-c", "bin/rails db:prepare db:migrate:cache db:migrate:queue db:migrate:cable 2>/dev/null || true && bin/rails server -b 0.0.0.0 -p ${PORT:-3000}"]
