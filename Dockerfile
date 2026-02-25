FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

COPY bookmysalon-app/pom.xml ./pom.xml
RUN mvn -q -DskipTests dependency:go-offline

COPY bookmysalon-app/src ./src
RUN mvn -q -DskipTests clean package

FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /app/target/bookmysalon-app-1.0.0.jar app.jar

ENV PORT=10000
EXPOSE 10000

ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT} -jar app.jar"]
