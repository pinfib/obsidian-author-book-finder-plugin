interface OrcidSearchResult {
	"expanded-result": Array<{
		"orcid-id": string;
		"given-names": string;
		"family-names": string;
		"credit-name": string | null;
		"other-name": string[];
		email: string[];
		"institution-name": string[];
	}>;
	"num-found": number;
}

interface OrcidSummary {
	name: string;
	orcid: string;
	employmentAffiliations: Array<{
		organizationName: string;
		url: string | null;
		startDate: string;
		endDate: string | null;
		role: string;
		type: string;
		validated: boolean;
		putCode: number;
	}>;
	employmentAffiliationsCount: number;
	creation: string;
	lastModified: string;
	validatedWorks: number;
	selfAssertedWorks: number;
	selfAssertedPeerReviews: number;
	peerReviewsTotal: number;
	peerReviewPublicationGrants: number;
	validatedFunds: number;
	selfAssertedFunds: number;
	professionalActivities: any | null;
	professionalActivitiesCount: number;
	externalIdentifiers: Array<{
		id: string;
		commonName: string;
		reference: string;
		url: string;
		validated: boolean;
	}>;
	status: string;
	educationQualifications: Array<{
		organizationName: string;
		url: string | null;
		startDate: string;
		endDate: string | null;
		role: string;
		type: string;
		validated: boolean;
		putCode: number;
	}>;
	educationQualificationsCount: number;
	validatedResearchResources: number;
	selfAssertedResearchResources: number;
	emailDomains: string[];
	emailDomainsCount: number;
}

interface ResearcherInfo {
	profileUrl: string;
	// affiliations: string[];
	// works: {
	// 	validated: number;
	// 	selfAsserted: number;
	// };
	// education: Array<{
	// 	organization: string;
	// 	role: string;
	// 	startDate: string;
	// 	endDate: string | null;
	// }>;
	// otherIdentifiers: Array<{
	// 	name: string;
	// 	value: string;
	// 	url: string;
	// }>;
}

export async function getOrcidPersonalInfo(
	name: string
): Promise<ResearcherInfo | null> {
	try {
		const encodedName = encodeURIComponent(name);
		const searchUrl = `https://pub.orcid.org/v3.0/expanded-search/?q=%7B!edismax%20qf%3D%22given-and-family-names%5E50.0%20family-name%5E10.0%20given-names%5E10.0%20credit-name%5E10.0%20other-names%5E5.0%20text%5E1.0%22%20pf%3D%22given-and-family-names%5E50.0%22%20bq%3D%22current-institution-affiliation-name%3A%5B*%20TO%20*%5D%5E100.0%20past-institution-affiliation-name%3A%5B*%20TO%20*%5D%5E70%22%20mm%3D1%7D${encodedName}&start=0&rows=1`;

		const searchResponse = await fetch(searchUrl, {
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (!searchResponse.ok) {
			throw new Error(
				`Search HTTP error! status: ${searchResponse.status}`
			);
		}

		const responseText = await searchResponse.text();
		const searchData: OrcidSearchResult = JSON.parse(responseText);

		if (
			searchData["num-found"] === 0 ||
			searchData["expanded-result"].length === 0
		) {
			return null;
		}

		const firstResult = searchData["expanded-result"][0];
		const orcidId = firstResult["orcid-id"];
		// const summaryUrl = `https://orcid.org/${orcidId}/summary.json`;

		// console.log("summaryUrl", summaryUrl);

		// const summaryResponse = await fetch(summaryUrl, {
		// 	//mode: "no-cors",
		// 	headers: {
		// 		"Content-Type": "application/json",
		// 	},
		// });

		// //console.log(summaryResponse);

		// if (!summaryResponse.ok) {
		// 	throw new Error(
		// 		`Summary HTTP error! status: ${summaryResponse.status}`
		// 	);
		// }

		// //const summaryData: OrcidSummary = await summaryResponse.json();

		// const summaryDataText = await summaryResponse.text();
		// const summaryData: OrcidSummary = JSON.parse(summaryDataText);

		// //const searchData: OrcidSearchResult = await searchResponse.json();
		// console.log("summary", summaryData);

		return { profileUrl: `https://orcid.org/${orcidId}` };

		// return {
		// 	profileUrl: `https://orcid.org/${orcidId}`,
		// 	affiliations: summaryData.employmentAffiliations.map(
		// 		(affil) =>
		// 			`${affil.organizationName} (${affil.role}, ${
		// 				affil.startDate
		// 			}${affil.endDate ? `-${affil.endDate}` : ""})`
		// 	),
		// 	works: {
		// 		validated: summaryData.validatedWorks,
		// 		selfAsserted: summaryData.selfAssertedWorks,
		// 	},
		// 	education: summaryData.educationQualifications.map((edu) => ({
		// 		organization: edu.organizationName,
		// 		role: edu.role,
		// 		startDate: edu.startDate,
		// 		endDate: edu.endDate,
		// 	})),
		// 	otherIdentifiers: summaryData.externalIdentifiers.map((id) => ({
		// 		name: id.commonName,
		// 		value: id.reference,
		// 		url: id.url,
		// 	})),
		//};
	} catch (error) {
		console.error("Error fetching researcher info:", error);
		throw error;
	}
}

export function formatOrcidPersonalInfo(
	researcherInfo: ResearcherInfo | null
): string {
	if (!researcherInfo) {
		return "- ORCID: Данные исследователя не найдены или произошла ошибка";
	}

	const lines = [
		`- ORCID: профиль: ${researcherInfo.profileUrl} (на этом ресурсе автор сам заполняет данные о себе)`,
		// `\t- аффилиации:`,
		// ...researcherInfo.affiliations.map((affil) => `\t\t• ${affil}`),
		// `\t- работы:`,
		// `\t\t• Подтвержденные работы: ${researcherInfo.works.validated}`,
		// `\t\t• Неподтвержденные работы: ${researcherInfo.works.selfAsserted}`,
		// `\t- Образование и квалификация:`,
		// ...researcherInfo.education.map(
		// 	(edu) =>
		// 		`\t\t• ${edu.organization} (${edu.role}, ${edu.startDate}${
		// 			edu.endDate ? `-${edu.endDate}` : ""
		// 		})`
		// ),
		// `\t- другие идентификаторы:`,
		// ...researcherInfo.otherIdentifiers.map(
		// 	(id) =>
		// 		`\t\t• ${id.name}: ${id.value}${id.url ? ` (${id.url})` : ""}`
		// ),
	];

	return lines.join("\n");
}

export default getOrcidPersonalInfo;
