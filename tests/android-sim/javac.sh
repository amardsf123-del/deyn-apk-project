#!/usr/bin/env bash
# javac wrapper for JREs that ship the jdk.compiler module but no javac launcher.
exec java -m jdk.compiler/com.sun.tools.javac.Main "$@"
