#!/usr/bin/env bash
# Compiles the REAL DeynSmsPlugin.java against hand-written Android/Capacitor/WorkManager stand-ins and runs the
# native scheduling simulation. Works with a full JDK (javac) or a JRE that ships the jdk.compiler module.
set -eu
cd "$(dirname "$0")"
rm -rf out && mkdir out
if command -v javac >/dev/null 2>&1; then JAVAC=javac; else JAVAC="java -m jdk.compiler/com.sun.tools.javac.Main"; fi
$JAVAC -encoding UTF-8 -Xlint:-options -d out $(find stubs -name '*.java') src/NativeSchedulingSim.java ../../deyn-app/native/DeynSmsPlugin.java
java -ea -cp out com.deyn.app.NativeSchedulingSim
