import com.github.gradle.node.npm.task.NpmTask

plugins {
    id("com.github.node-gradle.node") version "7.0.2"
}

node {
    version.set("20.9.0")
    npmVersion.set("10.1.0")
    download.set(true)
}

tasks.register<NpmTask>("buildFrontend") {
    dependsOn(tasks.named("npmInstall"))
    args.set(listOf("run", "build"))
    inputs.dir("src")
    inputs.files("package.json", "tsconfig.json", "vite.config.ts", "index.html")
    outputs.dir("dist")
}
