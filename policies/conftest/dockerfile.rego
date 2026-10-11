package main

import rego.v1

# Demo policy-as-code for CRACCON'26 — insecure Dockerfile defaults.

deny contains msg if {
	not has_user
	msg := "Dockerfile must set a non-root USER (demo policy)"
}

deny contains msg if {
	some i
	input[i].Cmd == "user"
	user := concat(" ", object.get(input[i], "Value", []))
	user == "root"
	msg := "Dockerfile USER must not be root (demo policy)"
}

deny contains msg if {
	not has_healthcheck
	msg := "Dockerfile must include HEALTHCHECK (demo policy)"
}

has_user if {
	some i
	input[i].Cmd == "user"
	user := concat(" ", object.get(input[i], "Value", []))
	user != "root"
}

has_healthcheck if {
	some i
	input[i].Cmd == "healthcheck"
}
