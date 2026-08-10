// The signer-builder pin (ADR-0018 §4, SLSA: "Consumers MUST accept only
// specific signer-builder pairs"). A valid signature alone is not
// verification: this policy asserts the provenance was produced by OUR
// Zuul tenant's post pipeline building the pilot project.
predicateType: "https://slsa.dev/provenance/v1"
predicate: {
	buildDefinition: {
		buildType: "urn:asdlc:zuul-job:v1"
		externalParameters: {
			project: "gerrit/pilot"
			ref:     "refs/heads/master"
		}
	}
	runDetails: {
		builder: {
			id: "urn:asdlc:zuul:asdlc:post"
		}
	}
}
