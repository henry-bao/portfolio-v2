#!/bin/bash

# Fix type casting issues in appwrite.ts
sed -i 's/as Models\.Document & ProfileData/as unknown as Models.Document \& ProfileData/g' src/services/appwrite.ts
sed -i 's/as (Models\.Document & ProjectData)\[\]/as unknown as (Models.Document \& ProjectData)[]/g' src/services/appwrite.ts
sed -i 's/as (Models\.Document & BlogPost)\[\]/as unknown as (Models.Document \& BlogPost)[]/g' src/services/appwrite.ts
sed -i 's/as Models\.Document & BlogPost/as unknown as Models.Document \& BlogPost/g' src/services/appwrite.ts
sed -i 's/as Models\.Document & SectionVisibility/as unknown as Models.Document \& SectionVisibility/g' src/services/appwrite.ts

# Fix type casting issues in resumeService.ts
sed -i 's/as (Models\.Document & ResumeVersion)\[\]/as unknown as (Models.Document \& ResumeVersion)[]/g' src/services/resumeService.ts
sed -i 's/as Models\.Document & ResumeVersion/as unknown as Models.Document \& ResumeVersion/g' src/services/resumeService.ts

# Fix type casting issues in components
sed -i 's/as Models\.Document & BlogPost/as unknown as Models.Document \& BlogPost/g' src/components/dashboard/BlogEditor.tsx
sed -i 's/as Models\.Document & ProjectData/as unknown as Models.Document \& ProjectData/g' src/components/dashboard/ProjectEditor.tsx

echo "Type casting issues fixed!"
