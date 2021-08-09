// @ts-ignore
import RpcSubprovider from "web3-provider-engine/subproviders/rpc"
import { randomAddress, toAddress } from "@rarible/types"
import { deployTestErc20 } from "./contracts/test/test-erc20"
import { approveErc20 } from "./approve-erc20"
import { toBn } from "../common/to-bn"
import { sentTx } from "../common/send-transaction"
import { createGanacheProvider } from "../test/create-ganache-provider"
import { awaitAll } from "../common/await-all"

describe("approveErc20", () => {
	const { web3, addresses } = createGanacheProvider()
	const [testAddress] = addresses

	const it = awaitAll({
		testErc20: deployTestErc20(web3, "TST", "TST")
	})

	beforeAll(async () => {
		await it.testErc20.methods.mint(testAddress, 100).send({ from: testAddress, gas: 200000 })
	})

	test("should approve exact value if not infinite", async () => {

		const operator = randomAddress()
		await approveErc20(sentTx, web3, toAddress(it.testErc20.options.address), testAddress, operator, toBn(100), false)

		const result = toBn(await it.testErc20.methods.allowance(testAddress, operator).call())
		expect(result.eq(100)).toBeTruthy()
	})

	test("should approve if value infinite", async () => {
		const infiniteBn = toBn(2).pow(256).minus(1)

		const operator = randomAddress()
		await approveErc20(sentTx, web3, toAddress(it.testErc20.options.address), testAddress, operator, toBn( infiniteBn), true)

		const result = toBn(await it.testErc20.methods.allowance(testAddress, operator).call())
		expect(result.eq(infiniteBn)).toBeTruthy()
	})

	test("should not approve", async () => {

		const operator = randomAddress()
		const testBnValue = toBn(200)

		await sentTx(it.testErc20.methods.approve(operator, testBnValue), { from: testAddress })

		await approveErc20(sentTx, web3, toAddress(it.testErc20.options.address), testAddress, operator, toBn(testBnValue), false)

		const result = toBn(await it.testErc20.methods.allowance(testAddress, operator).call())
		expect(result.eq(testBnValue)).toBeTruthy()
	})
})
