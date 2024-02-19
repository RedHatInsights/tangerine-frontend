import { Link, useParams } from "react-router-dom"

function Agent() {
    const { agentId } = useParams()

    return(
        <>
            <Link to="/">Back</Link>
            <h1>Agent: {agentId} </h1>
        </>
    )
}

export default Agent
