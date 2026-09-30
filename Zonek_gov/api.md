Data Module	Status	Source Type	Primary Source	Update Frequency	Official Link	API	
Crop Prices	LIVE	API	agmarknet.gov.in	Daily	agmarknet.gov.in	579b464db66ec23bdd000001343ae0a078744bac6e6595accd519afa	https://www.data.gov.in/resource/variety-wise-daily-market-prices-data-commodity
Weather	LIVE	API	IMD / OpenWeather	Hourly	mausam.imd.gov.in	application posted	
Rainfall	LIVE	API	State Monitoring Centre*	Daily	Varies by State	NOT NEEDED	
Dam Levels	LIVE	Collected	State Water Resources*	Daily	Varies by State	NOT NEEDED	
Schemes	STATIC	API	MyScheme.gov.in	Weekly	myscheme.gov.in	COULD NOT GET IN PAN ISSUE	Option 2 — Hugging Face Dataset (Pre-scraped, Weekly Updated)A public dataset containing structured information extracted from myScheme.gov.in is available on Hugging Face, including scheme name, description, eligibility criteria, benefits, application process, and official links — available in CSV, JSON, and Parquet formats. Hugging FaceURL: https://huggingface.co/datasets/shrijayan/gov_myschemeDownload the JSON, host it yourself, set up a cron job to pull updates weekly. Free forever.
Elections	STATIC	Static	Election Commission (ECI)	Post-election	eci.gov.in		SCRAPPING
https://results.eci.gov.in/ResultAcGenNov2025/index.htm
Budget & Revenue	STATIC	PDF Parse	State Finance Dept*	Quarterly	Varies by State		
Infrastructure	LIVE	RSS	Google News / Media	Hourly	-		https://news.google.com/rss/search?q=infrastructure+India&hl=en-IN&gl=IN&ceid=IN:enhttps://news.google.com/rss/search?q=infrastructure+Tamil+Nadu&hl=en-IN&gl=IN&ceid=IN:enhttps://news.google.com/rss/search?q=roads+metro+construction+South+India&hl=en-IN&gl=IN&ceid=IN:en
Schools	STATIC	API	UDISE+ (MoE)	Annual	udiseplus.gov.in	https://dashboard.udiseplus.gov.in/#/	https://dashboard.udiseplus.gov.in/#/
Jal Jeevan (JJM)	LIVE	API	JJM National Dashboard	Weekly	ejalshakti.gov.in	applied	form
Housing (PMAY)	LIVE	API	AwaasSoft (PMAY)	Monthly	pmayg.nic.in		
Courts	STATIC	API	NJDG (Judicial Data Grid)	Weekly	njdg.ecourts.gov.in		
Police / Crime	STATIC	PDF Parse	NCRB Annual Report	Annual	ncrb.gov.in		
Population	STATIC	Static	Census of India 2011	Decennial	censusindia.gov.in		
Transport	STATIC	API	KSRTC / IRCTC	Monthly	ksrtc.in		
Panchayats	STATIC	API	ePanchayat / PRIASoft	Monthly	egramswaraj.gov.in		

Budget very important

State	Responsible Department	Official Website / Data Source	DATA/API
Karnataka	Finance Department, Govt of Karnataka	finance.karnataka.gov.in	
Telangana	Finance Department / IFMIS Telangana	finance.telangana.gov.in & ifmis.telangana.gov.in	
Tamil Nadu	Finance Department, Govt of Tamil Nadu	tn.gov.in/finance	
Maharashtra	Finance Department, Govt of Maharashtra	finance.maharashtra.gov.in	
Uttar Pradesh	Department of Finance, Govt of UP	budget.up.nic.in	
West Bengal	Finance Department, Govt of West Bengal	finance.wb.gov.in	
Delhi	Finance Department, GNCTD	delhigovt.nic.in	