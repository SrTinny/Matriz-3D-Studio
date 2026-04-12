import React, { Suspense } from 'react';
import HomeClient from './HomeClient';
import HomePageSkeleton from './_components/HomePageSkeleton';

export default function Page() {
	return (
		<Suspense fallback={<HomePageSkeleton />}>
			<HomeClient />
		</Suspense>
	);
}

