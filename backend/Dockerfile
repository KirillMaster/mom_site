FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5000
EXPOSE 5001

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

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
ENTRYPOINT ["dotnet", "MomSite.API.dll"]