FROM registry.access.redhat.com/ubi9/nodejs-18 AS builder

ADD package.json $HOME
ADD package-lock.json $HOME
ADD src $HOME/src
ADD public $HOME/public

USER 0
RUN fix-permissions ./
USER 1001

ENV NODE_ENV=production
ENV PORT=3000

# Install the dependencies
RUN npm -d install
RUN npm run -d build

FROM registry.access.redhat.com/ubi9/nodejs-18-minimal

COPY --from=builder $HOME/build $HOME/build

RUN npm install serve

USER 0
RUN chown -R 1001:0 ${APP_ROOT} && chmod -R ug+rwx ${APP_ROOT} && \
    fix-permissions ${APP_ROOT}

USER 1001

EXPOSE 3000

CMD ["serve", "-s", "./build"]
