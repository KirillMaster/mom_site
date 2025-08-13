FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5000
EXPOSE 5001

# Install FFmpeg and curl for video processing and health checks
RUN apt-get update && apt-get install -y ffmpeg curl

# Create logs and uploads directories
RUN mkdir -p /app/logs && chmod 755 /app/logs
RUN mkdir -p /app/uploads && chmod 755 /app/uploads

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["MomSite.API/MomSite.API.csproj", "MomSite.API/"]
COPY ["MomSite.Core/MomSite.Core.csproj", "MomSite.Core/"]
COPY ["MomSite.Infrastructure/MomSite.Infrastructure.csproj", "MomSite.Infrastructure/"]
RUN dotnet restore "MomSite.API/MomSite.API.csproj"
COPY . .
WORKDIR "/src/MomSite.API"
RUN dotnet build "MomSite.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "MomSite.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Set proper permissions
RUN chown -R 1001:1001 /app/logs
RUN chown -R 1001:1001 /app/uploads

ENTRYPOINT ["dotnet", "MomSite.API.dll"]