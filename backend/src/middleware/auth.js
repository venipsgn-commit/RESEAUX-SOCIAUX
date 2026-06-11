export async function authenticate(request, reply) {
    try {
        await request.jwtVerify();
    } catch (err) {
        reply.code(401).send({ error: 'Unauthorized', message: 'Invalid or missing token' });
    }
}

export function requireKyc(minLevel) {
    return async (request, reply) => {
        const kyc = request.user?.kyc_level || 0;
        if (kyc < minLevel) {
            reply.code(403).send({
                error: 'KycRequired',
                message: `KYC level ${minLevel} required`,
                currentLevel: kyc,
            });
        }
    };
}
